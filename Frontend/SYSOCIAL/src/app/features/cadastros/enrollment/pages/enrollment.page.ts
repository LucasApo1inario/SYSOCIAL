import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { EnrollmentService } from '../services/enrollment.service';
import { StudentFormComponent } from '../components/student-form.component';
import { GuardianListComponent } from '../components/guardian-list.component';
import { AcademicFormComponent } from '../components/academic-form.component';
import { DocumentsFormComponent } from '../components/documents-form.component';

@Component({
  selector: 'app-enrollment-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    StudentFormComponent,
    GuardianListComponent,
    AcademicFormComponent,
    DocumentsFormComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50 py-10 px-4 font-sans flex justify-center items-start">
      <div class="w-full max-w-5xl">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">Nova matrícula</h1>

        <form [formGroup]="mainForm" (ngSubmit)="onSubmit()">
          
          <!-- 1. Componente Aluno -->
          <app-student-form 
             [parentForm]="getGroup('student')"
             [age]="studentAge">
          </app-student-form>

          <!-- 2. Componente Responsáveis -->
          <app-guardian-list
             [parentForm]="mainForm"
             [relationshipOptions]="relationshipOptions"
             (add)="addGuardian()"
             (remove)="removeGuardian($event)"
             (principalChange)="onPrincipalChange($event)">
          </app-guardian-list>

          <!-- 3. Componente Acadêmico -->
          <app-academic-form
             [parentForm]="mainForm"
             [availableCourses]="courses"
             [allClasses]="classes"
             (add)="addCourse()"
             (remove)="removeCourse($event)">
          </app-academic-form>

          <!-- 4. Componente Documentos -->
          <app-documents-form
            [parentForm]="mainForm"
            [documentTypes]="documentTypes"
            (add)="addDocument()"
            (remove)="removeDocument($event)"
            (fileSelected)="onDocumentFileSelected($event)">
          </app-documents-form>

          <!-- Botões -->
          <div class="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button type="button" class="px-8 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-all shadow-sm" routerLink="/">
              Cancelar
            </button>
            <button type="submit" [disabled]="mainForm.invalid" class="px-10 py-3 bg-[#246A73] text-white font-bold rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-gray-500/20 disabled:cursor-not-allowed disabled:shadow-none transform hover:-translate-y-0.5">
              Salvar Matrícula
            </button>
          </div>

        </form>
      </div>
    </div>
  `
})
export class EnrollmentPage implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(EnrollmentService);

  mainForm: FormGroup;
  studentAge: number = -1;
  
  // Dados locais
  courses: any[] = [];
  classes: any[] = [];
  relationshipOptions: any[] = [];
  documentTypes: string[] = [];

  constructor() {
    this.relationshipOptions = this.service.relationshipOptions;
    this.documentTypes = this.service.documentTypes;

    this.mainForm = this.fb.group({
      // 1. Aluno
      student: this.fb.group({
        fullName: ['', Validators.required],
        birthDate: ['', Validators.required],
        cpf: ['', Validators.required],
        phone: [''],
        gender: [''],
        // Campos de Endereço
        zipCode: ['', Validators.required],
        street: ['', Validators.required],
        number: ['', Validators.required],
        neighborhood: ['', Validators.required],
        // Campos Escolares
        currentSchool: [''],
        series: [''],
        schoolShift: [''],
      }),
      // 2. Arrays
      guardians: this.fb.array([ this.createGuardianGroup(true) ]),
      enrollments: this.fb.array([ this.createCourseGroup() ]),
      docs: this.fb.array([])
    });
  }

  ngOnInit() {
    this.service.getCourses().subscribe(data => this.courses = data);
    this.service.getAllClasses().subscribe(data => this.classes = data);

    // Monitora idade
    this.mainForm.get('student.birthDate')?.valueChanges.subscribe(val => {
      this.studentAge = this.service.calculateAge(val);
    });
  }

  // Helpers
  getGroup(name: string): FormGroup { return this.mainForm.get(name) as FormGroup; }
  get guardiansArray(): FormArray { return this.mainForm.get('guardians') as FormArray; }
  get enrollmentsArray(): FormArray { return this.mainForm.get('enrollments') as FormArray; }
  get docsArray(): FormArray { return this.mainForm.get('docs') as FormArray; }

  // --- Lógica de Responsáveis ---
  createGuardianGroup(isPrincipal: boolean = false): FormGroup {
    return this.fb.group({
      fullName: ['', Validators.required],
      cpf: ['', Validators.required],
      relationship: ['', Validators.required], 
      phone: ['', Validators.required],        
      phoneContact: [''], 
      messagePhone1: [''],                     
      messagePhone1Contact: [''], 
      messagePhone2: [''],                     
      messagePhone2Contact: [''], 
      isPrincipal: [isPrincipal]
    });
  }

  addGuardian() { this.guardiansArray.push(this.createGuardianGroup()); }
  
  removeGuardian(index: number) {
    if (this.guardiansArray.length <= 1) {
      alert('É necessário manter pelo menos um responsável.');
      return;
    }
    this.guardiansArray.removeAt(index);
    const hasPrincipal = this.guardiansArray.controls.some(g => g.get('isPrincipal')?.value);
    if (!hasPrincipal) this.guardiansArray.at(0).get('isPrincipal')?.setValue(true);
  }

  onPrincipalChange(index: number) {
    const current = this.guardiansArray.at(index);
    const isChecked = current.get('isPrincipal')?.value;

    if (!isChecked) {
       const hasOther = this.guardiansArray.controls.some((g, i) => i !== index && g.get('isPrincipal')?.value);
       if (!hasOther) {
         current.get('isPrincipal')?.setValue(true, { emitEvent: false });
         alert('É obrigatório ter um responsável principal.');
         return;
       }
    }

    if (isChecked) {
      this.guardiansArray.controls.forEach((c, i) => {
        if (i !== index) c.get('isPrincipal')?.setValue(false, { emitEvent: false });
      });
    }
  }

  // --- Lógica Acadêmica ---
  createCourseGroup(): FormGroup {
    return this.fb.group({
      courseId: ['', Validators.required],
      classId: ['', Validators.required]
    });
  }
  
  addCourse() { this.enrollmentsArray.push(this.createCourseGroup()); }
  removeCourse(index: number) { this.enrollmentsArray.removeAt(index); }

  // --- Lógica Documentos ---
  addDocument() {
    this.docsArray.push(this.fb.group({
      type: ['', Validators.required],
      fileName: ['', Validators.required],
      file: [null]
    }));
  }

  removeDocument(index: number) { this.docsArray.removeAt(index); }

  onDocumentFileSelected(data: {event: Event, index: number}) {
    const input = data.event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const docGroup = this.docsArray.at(data.index) as FormGroup;
      docGroup.patchValue({ fileName: file.name, file: file });
    }
  }

  onSubmit() {
    if (this.mainForm.valid) {
      const fullData = {
        ...this.mainForm.getRawValue(),
        calculatedAge: this.studentAge
      };
      console.log('Dados completos para envio (GO API):', fullData);
      alert('Matrícula criada com sucesso!');
    } else {
      this.mainForm.markAllAsTouched();
      alert('Por favor, preencha todos os campos obrigatórios.');
    }
  }
}