import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ClassOption, CourseOption } from '../interfaces/attendance.model';

@Component({
  selector: 'app-attendance-filter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <form [formGroup]="form" class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        
        <!-- 1. Curso -->
        <div class="md:col-span-4">
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1.5">Curso</label>
          <select formControlName="courseId" (change)="onCourseChange()" class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#246A73] focus:border-transparent">
            <option [ngValue]="null" disabled>Selecione...</option>
            <option *ngFor="let c of courses" [value]="c.id">{{ c.name }}</option>
          </select>
        </div>

        <!-- 2. Turma -->
        <div class="md:col-span-4">
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1.5">Turma</label>
          <select formControlName="classId" (change)="emitFilter()" class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#246A73] focus:border-transparent">
            <option [ngValue]="null" disabled>Selecione...</option>
            <option *ngFor="let c of classes" [value]="c.id">{{ c.name }} - {{ c.schedule }}</option>
          </select>
        </div>

        <!-- 3. Mês/Ano -->
        <div class="md:col-span-4 flex gap-2">
          <div class="flex-1">
             <label class="block text-xs font-bold text-gray-500 uppercase mb-1.5">Mês</label>
             <select formControlName="month" (change)="emitFilter()" class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white">
               <option *ngFor="let m of months; let i = index" [value]="i">{{ m }}</option>
             </select>
          </div>
          <div class="w-24">
             <label class="block text-xs font-bold text-gray-500 uppercase mb-1.5">Ano</label>
             <input type="number" formControlName="year" (change)="emitFilter()" class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white">
          </div>
        </div>

      </form>
    </div>
  `
})
export class AttendanceFilterComponent implements OnInit {
  @Input() courses: CourseOption[] = [];
  @Input() classes: ClassOption[] = [];
  @Output() filterChange = new EventEmitter<any>();
  @Output() courseChange = new EventEmitter<number>();

  private fb = inject(FormBuilder);
  
  months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  form: FormGroup = this.fb.group({
    courseId: [null],
    classId: [null],
    month: [new Date().getMonth()],
    year: [new Date().getFullYear()]
  });

  ngOnInit() {
    // Se receber cursos, seleciona o primeiro (Regra de Negócio)
    // Isso será chamado pelo pai
  }

  onCourseChange() {
    const courseId = this.form.get('courseId')?.value;
    if (courseId) {
      this.courseChange.emit(Number(courseId));
      // Reseta turma ao mudar curso
      this.form.patchValue({ classId: null });
    }
  }

  emitFilter() {
    if (this.form.valid && this.form.value.classId) {
      this.filterChange.emit(this.form.value);
    }
  }
}