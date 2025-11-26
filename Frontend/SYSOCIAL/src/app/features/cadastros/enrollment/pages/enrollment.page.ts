import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

import { EnrollmentService } from '../services/enrollment.service';
import { StudentFormComponent } from '../components/student-form.component';
import { GuardianListComponent } from '../components/guardian-list.component';
import { AcademicFormComponent } from '../components/academic-form.component';
import { DocumentsFormComponent } from '../components/documents-form.component';
import { CourseOption, EnrollmentPayload, FileUploadRequest } from '../interfaces/enrollment.model';

@Component({
  selector: 'app-enrollment-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    HttpClientModule,
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
          
          <app-student-form 
             [parentForm]="getGroup('student')"
             [age]="studentAge">
          </app-student-form>

          <app-guardian-list
             [parentForm]="mainForm"
             [relationshipOptions]="relationshipOptions"
             (add)="addGuardian()"
             (remove)="removeGuardian($event)"
             (principalChange)="onPrincipalChange($event)">
          </app-guardian-list>

          <app-academic-form
             [parentForm]="mainForm"
             [availableCourses]="availableCourses"
             (add)="addCourse()"
             (remove)="removeCourse($event)">
          </app-academic-form>

          <app-documents-form
            [parentForm]="mainForm"
            [documentTypes]="documentTypes"
            (add)="addDocument()"
            (remove)="removeDocument($event)"
            (fileSelected)="onDocumentFileSelected($event)">
          </app-documents-form>

          <div class="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button type="button" class="px-8 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-all shadow-sm" routerLink="/">
              Cancelar
            </button>
            <button type="submit" [disabled]="mainForm.invalid || isSubmitting" class="px-10 py-3 bg-[#246A73] text-white font-bold rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-gray-500/20 disabled:cursor-not-allowed disabled:shadow-none transform hover:-translate-y-0.5">
              {{ isSubmitting ? submittingMessage : 'Salvar Matrícula' }}
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
  isSubmitting = false;
  submittingMessage = 'Enviando...';
  
  availableCourses: CourseOption[] = [];
  relationshipOptions: any[] = [];
  documentTypes: string[] = [];

  constructor() {
    this.relationshipOptions = this.service.relationshipOptions;
    this.documentTypes = this.service.documentTypes;

    this.mainForm = this.fb.group({
      student: this.fb.group({
        fullName: ['', Validators.required],
        birthDate: ['', Validators.required],
        cpf: ['', Validators.required],
        phone: [''],
        gender: [''],
        zipCode: ['', Validators.required],
        street: ['', Validators.required],
        number: ['', Validators.required],
        neighborhood: ['', Validators.required],
        currentSchool: [''],
        series: [''],
        schoolShift: ['', Validators.required],
      }),
      guardians: this.fb.array([ this.createGuardianGroup(true) ]),
      enrollments: this.fb.array([ this.createCourseGroup() ]),
      docs: this.fb.array([])
    });
  }

  ngOnInit() {
    this.mainForm.get('student.birthDate')?.valueChanges.subscribe(val => {
      this.studentAge = this.service.calculateAge(val);
    });

    this.mainForm.get('student.schoolShift')?.valueChanges.subscribe(shift => {
      if (shift) {
        this.loadCourses(shift);
      }
    });
  }

  loadCourses(shift: string) {
    const enrollments = this.enrollmentsArray;
    while (enrollments.length !== 0) {
      enrollments.removeAt(0);
    }
    this.addCourse();

    this.service.getAvailableCourses(shift).subscribe({
      next: (data) => this.availableCourses = data,
      error: (err) => {
        console.error(err);
        alert('Erro ao carregar cursos.');
      }
    });
  }

  // Getters
  getGroup(name: string): FormGroup { return this.mainForm.get(name) as FormGroup; }
  get guardiansArray(): FormArray { return this.mainForm.get('guardians') as FormArray; }
  get enrollmentsArray(): FormArray { return this.mainForm.get('enrollments') as FormArray; }
  get docsArray(): FormArray { return this.mainForm.get('docs') as FormArray; }

  // Helpers de Formulário
  createGuardianGroup(isPrincipal: boolean = false): FormGroup {
    return this.fb.group({
      fullName: ['', Validators.required],
      cpf: ['', Validators.required],
      relationship: ['', Validators.required], 
      phone: ['', Validators.required],        
      phoneContact: [''], 
      messagePhone1: [''], messagePhone1Contact: [''], 
      messagePhone2: [''], messagePhone2Contact: [''], 
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
    if (!current.get('isPrincipal')?.value) {
       const hasOther = this.guardiansArray.controls.some((g, i) => i !== index && g.get('isPrincipal')?.value);
       if (!hasOther) {
         current.get('isPrincipal')?.setValue(true, { emitEvent: false });
         alert('É obrigatório ter um responsável principal.');
         return;
       }
    } else {
      this.guardiansArray.controls.forEach((c, i) => {
        if (i !== index) c.get('isPrincipal')?.setValue(false, { emitEvent: false });
      });
    }
  }

  createCourseGroup(): FormGroup {
    return this.fb.group({ courseId: ['', Validators.required], classId: ['', Validators.required] });
  }
  
  addCourse() { this.enrollmentsArray.push(this.createCourseGroup()); }
  removeCourse(index: number) { this.enrollmentsArray.removeAt(index); }

  addDocument() {
    this.docsArray.push(this.fb.group({
      type: ['', Validators.required],
      fileName: ['', Validators.required],
      observation: [''], 
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

  // --- SUBMISSÃO ORQUESTRADA ---
  async onSubmit() {
    if (this.mainForm.invalid) {
      this.mainForm.markAllAsTouched();
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    this.isSubmitting = true;
    this.submittingMessage = 'Salvando Matrícula...';

    try {
      const rawValue = this.mainForm.getRawValue();
      
      // 1. Criar Payload da Matrícula (apenas metadados dos docs)
      const enrollmentPayload: EnrollmentPayload = {
        student: rawValue.student,
        guardians: rawValue.guardians,
        documents: rawValue.docs.map((d: any) => ({ 
          type: d.type, 
          fileName: d.fileName,
          observation: d.observation 
        })), 
        courses: rawValue.enrollments
      };

      // 2. Enviar Matrícula (Service 8084)
      const enrollmentResponse = await lastValueFrom(this.service.createEnrollment(enrollmentPayload));
      const enrollmentId = enrollmentResponse.enrollmentId;

      console.log('Matrícula criada com ID:', enrollmentId);

      // 3. Upload dos Arquivos (Service 8083)
      if (rawValue.docs && rawValue.docs.length > 0) {
        this.submittingMessage = `Enviando ${rawValue.docs.length} documentos...`;
        
        // Itera sobre os documentos e envia um por um
        for (const doc of rawValue.docs) {
          if (doc.file) {
            const base64 = await this.service.convertFileToBase64(doc.file);
            const filePayload: FileUploadRequest = {
              entidade_pai: 'matricula',
              id_entidade_pai: enrollmentId.toString(),
              arquivo_base64: base64,
              nome_arquivo: doc.fileName,
              extensao: doc.fileName.split('.').pop() || '',
              observacao: doc.observation || ''
            };
            
            await lastValueFrom(this.service.uploadFile(filePayload));
          }
        }
      }

      alert(`Sucesso! Matrícula e documentos salvos. ID: ${enrollmentId}`);
      // Aqui você poderia resetar o form ou redirecionar
      
    } catch (error) {
      console.error('Erro no processo:', error);
      alert('Ocorreu um erro. Verifique o console para detalhes.');
    } finally {
      this.isSubmitting = false;
      this.submittingMessage = 'Salvar Matrícula';
    }
  }
}