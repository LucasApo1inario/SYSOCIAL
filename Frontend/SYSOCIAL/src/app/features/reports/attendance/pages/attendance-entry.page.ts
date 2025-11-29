import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService } from '../services/attendance.service';
import { AttendanceFilterComponent } from '../components/attendance-filter.component';
import { AttendanceTableComponent } from '../components/attendance-table.component';
import { ClassOption, CourseOption, AttendanceGrid } from '../interfaces/attendance.model';

@Component({
  selector: 'app-attendance-entry-page',
  standalone: true,
  imports: [CommonModule, AttendanceFilterComponent, AttendanceTableComponent],
  template: `
    <div class="max-w-screen-2xl mx-auto p-6 pb-20">
      
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Lançamento de Frequência</h1>
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
        [gridData]="gridData">
      </app-attendance-table>

      <!-- Botão Salvar Fixo -->
      <div class="mt-8 flex justify-end" *ngIf="gridData">
        <button (click)="saveAll()" class="bg-[#246A73] text-white px-8 py-3 rounded-lg shadow-md font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 transform hover:-translate-y-0.5">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
          Salvar Chamada
        </button>
      </div>
    </div>
  `
})
export class AttendanceEntryPage implements OnInit {
  private service = inject(AttendanceService);

  // Referência ao componente filho para pré-selecionar curso (opcional)
  @ViewChild(AttendanceFilterComponent) filterComponent!: AttendanceFilterComponent;

  courses: CourseOption[] = [];
  classes: ClassOption[] = [];
  gridData: AttendanceGrid | null = null;
  isLoading = false;

  ngOnInit() {
    // 1. Carrega Cursos
    this.service.getCourses().subscribe(data => {
      this.courses = data;
      // Regra: Selecionar o primeiro curso por padrão
      if (this.courses.length > 0) {
        setTimeout(() => { // Timeout para garantir que o filho renderizou
          this.filterComponent.form.patchValue({ courseId: this.courses[0].id });
          this.onCourseChange(this.courses[0].id);
        });
      }
    });
  }

  onCourseChange(courseId: number) {
    // Carrega as turmas desse curso
    this.service.getClasses(courseId).subscribe(data => {
      this.classes = data;
      this.gridData = null; // Limpa a tabela antiga
    });
  }

  loadData(filter: any) {
    this.isLoading = true;
    this.service.getAttendanceMatrix(filter.classId, filter.month, filter.year).subscribe({
      next: (data) => {
        this.gridData = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        alert('Erro ao carregar dados.');
      }
    });
  }

  saveAll() {
    // Aqui você montaria o payload real e chamaria o serviço
    alert('Chamada salva com sucesso!');
  }
}