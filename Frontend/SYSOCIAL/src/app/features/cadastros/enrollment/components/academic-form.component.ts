import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormGroup } from '@angular/forms';
import { Course, ClassItem } from '../interfaces/enrollment.model';

@Component({
  selector: 'app-academic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div [formGroup]="parentForm" class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
      <div class="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
        <h2 class="text-xl font-bold text-gray-800">Matrícula Acadêmica</h2>
        <button type="button" (click)="add.emit()" class="flex items-center gap-2 px-3.5 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-xs font-semibold transition-colors border border-gray-200">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          Adicionar Curso
        </button>
      </div>

      <div formArrayName="enrollments">
        <div *ngFor="let enrollment of enrollments.controls; let i = index" [formGroupName]="i" class="mb-4 p-6 bg-gray-50 rounded-lg border border-gray-200 relative group hover:border-gray-300 transition-colors">
          
          <button *ngIf="enrollments.length > 1" type="button" (click)="remove.emit(i)" class="absolute top-4 right-4 text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-white transition-all shadow-sm" title="Remover Curso">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Curso</label>
              <select formControlName="courseId" 
                      [class.text-gray-300]="!enrollment.get('courseId')?.value"
                      [class.text-gray-700]="enrollment.get('courseId')?.value"
                      class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="" disabled selected class="text-gray-300">Selecione o curso...</option>
                <option *ngFor="let course of availableCourses" [value]="course.id" class="text-gray-900">{{ course.name }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Turma</label>
              <select formControlName="classId" 
                      [class.text-gray-300]="!enrollment.get('classId')?.value"
                      [class.text-gray-700]="enrollment.get('classId')?.value"
                      class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400">
                <option value="" disabled selected class="text-gray-300">Selecione a turma...</option>
                <option *ngFor="let classItem of getClassesFor(enrollment.get('courseId')?.value)" [value]="classItem.id" class="text-gray-900">{{ classItem.name }}</option>
              </select>
              <p *ngIf="!enrollment.get('courseId')?.value" class="text-xs text-gray-400 mt-2 font-medium flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Selecione um curso primeiro
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <p *ngIf="enrollments.length === 0" class="text-sm text-gray-500 text-center italic py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">Nenhum curso selecionado.</p>
    </div>
  `
})
export class AcademicFormComponent {
  @Input({required: true}) parentForm!: FormGroup;
  @Input() availableCourses: Course[] = [];
  @Input() allClasses: ClassItem[] = [];

  @Output() add = new EventEmitter<void>();
  @Output() remove = new EventEmitter<number>();

  get enrollments(): FormArray {
    return this.parentForm.get('enrollments') as FormArray;
  }

  getClassesFor(courseId: string): ClassItem[] {
    if (!courseId) return [];
    return this.allClasses.filter(c => c.courseId === courseId);
  }
}