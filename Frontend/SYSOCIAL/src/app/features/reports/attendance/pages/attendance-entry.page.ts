import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService } from '../services/attendance.service';
import { AttendanceFilterComponent } from '../components/attendance-filter.component';
import { AttendanceTableComponent } from '../components/attendance-table.component';
import { ClassOption, CourseOption, AttendanceGrid, AttendanceFilter } from '../interfaces/attendance.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-attendance-entry-page',
  standalone: true,
  imports: [CommonModule, AttendanceFilterComponent, AttendanceTableComponent],
  template: `
    <div class="max-w-screen-2xl mx-auto p-6 pb-20">
      
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Lançamento de Frequência</h1>
        </div>
      </div>

      <app-attendance-filter 
        [courses]="courses" 
        [classes]="classes"
        (courseChange)="onCourseChange($event)"
        (filterChange)="loadData($event)">
      </app-attendance-filter>

      <div *ngIf="isLoading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-[#246A73]"></div>
      </div>

      <app-attendance-table 
        *ngIf="!isLoading"
        [gridData]="gridData"
        (statusChange)="onStatusChange($event)">
      </app-attendance-table>

      <!-- Botão Salvar só aparece se houver dados -->
      <div class="mt-8 flex justify-end" *ngIf="gridData && gridData.dates.length > 0">
        <button (click)="saveAll()" [disabled]="isSaving" class="bg-[#246A73] text-white px-8 py-3 rounded-lg shadow-md font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
          <span *ngIf="isSaving">Salvando...</span>
          <span *ngIf="!isSaving">Salvar Chamada</span>
        </button>
      </div>
    </div>
  `
})
export class AttendanceEntryPage implements OnInit {
  private service = inject(AttendanceService);

  @ViewChild(AttendanceFilterComponent) filterComponent!: AttendanceFilterComponent;

  courses: CourseOption[] = [];
  classes: ClassOption[] = [];
  gridData: AttendanceGrid | null = null;
  isLoading = false;
  isSaving = false;
  currentFilter: AttendanceFilter | null = null;
  
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
    
    this.currentFilter = filter;
    this.isLoading = true;
    this.gridData = null; 
    
    this.service.getAttendanceMatrix(filter.classId, filter.month, filter.year).subscribe({
      next: (data) => {

        if (!data.dates) data.dates = [];
        
        this.gridData = data;
        this.changedDates.clear(); 
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        alert('Erro ao carregar dados.');
      }
    });
  }

  onStatusChange(event: {studentId: number, date: string, present: string | undefined}) {
    this.changedDates.add(event.date);
  }

  saveAll() {
    if (!this.gridData || !this.currentFilter?.classId) return;
    if (this.changedDates.size === 0) {
        alert('Nenhuma alteração para salvar.');
        return;
    }

    this.isSaving = true;
    const classId = this.currentFilter.classId;

    const saveRequests = Array.from(this.changedDates).map(date => {
        return this.service.saveDailyAttendance(
            classId, 
            date, 
            this.gridData!.students
        );
    });

    forkJoin(saveRequests).subscribe({
        next: () => {
            this.isSaving = false;
            alert('Chamada salva com sucesso!');
            this.changedDates.clear();
            this.loadData(this.currentFilter!);
        },
        error: (err) => {
            console.error('Erro detalhado:', err);
            this.isSaving = false;
            let msg = 'Erro ao salvar.';
            if (err.error && err.error.details) msg += ` Detalhes: ${err.error.details}`;
            else if (err.error && err.error.error) msg += ` Erro: ${err.error.error}`;
            alert(msg);
        }
    });
  }
}