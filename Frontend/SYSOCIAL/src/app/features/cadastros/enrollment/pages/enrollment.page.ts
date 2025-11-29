import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, AbstractControl, AsyncValidatorFn } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { lastValueFrom, of } from 'rxjs';
import { map } from 'rxjs/operators';

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
        
        <h1 class="text-3xl font-bold text-gray-900 mb-4">{{ isEditMode ? 'Editar Matrícula' : 'Nova Matrícula' }}</h1>

        <!-- AVISO DE MATRÍCULA INATIVA -->
        <div *ngIf="isInactive" class="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded shadow-sm flex items-start gap-3 animate-fade-in">
          <svg class="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <div>
            <h3 class="text-red-800 font-bold">Matrícula Inativa</h3>
            <p class="text-red-700 text-sm mt-1">Este aluno está com a matrícula cancelada. Ao salvar, os dados serão atualizados e a matrícula será <strong>reativada automaticamente</strong>.</p>
          </div>
        </div>

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
            <button type="button" class="px-8 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-all shadow-sm" routerLink="/cadastros/student-list">
              Cancelar
            </button>
            
            <button type="submit" [disabled]="mainForm.invalid || isSubmitting" 
                    [class.bg-red-600]="isInactive" [class.hover:bg-red-700]="isInactive"
                    [class.bg-[#246A73]]="!isInactive"
                    class="px-10 py-3 text-white font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-gray-500/20 disabled:cursor-not-allowed disabled:shadow-none transform hover:-translate-y-0.5">
              {{ isSubmitting ? submittingMessage : (isInactive ? 'Reativar Matrícula' : (isEditMode ? 'Salvar Alterações' : 'Salvar Matrícula')) }}
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  mainForm: FormGroup;
  studentAge: number = -1;
  
  isSubmitting = false;
  submittingMessage = 'Enviando...';
  isEditMode = false;
  isInactive = false;
  enrollmentId: number | null = null;
  
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
        cpf: ['', [Validators.required], [this.cpfAvailabilityValidator()]], 
        phone: [''],
        gender: [''],
        zipCode: ['', Validators.required],
        street: ['', Validators.required],
        number: ['', Validators.required],
        neighborhood: ['', Validators.required],
        currentSchool: [''],
        series: [''],
        schoolShift: ['', Validators.required],
        observation: [''],
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
        this.reloadCoursesForShift(shift);
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.enrollmentId = +id;
      this.loadEnrollmentData(this.enrollmentId);
    }
  }

  // --- CARREGAR DADOS (EDIÇÃO) ---
  loadEnrollmentData(id: number) {
    this.isSubmitting = true;
    this.submittingMessage = 'Carregando dados...';

    this.service.getEnrollmentById(id).subscribe({
      next: (data) => {
        // 1. Aluno
        this.mainForm.get('student.cpf')?.clearAsyncValidators();
        
        if (data.student) {
            // APLICA MÁSCARAS ANTES DE PREENCHER
            const studentWithMask = {
                ...data.student,
                cpf: this.formatCpfDisplay(data.student.cpf),
                phone: this.formatPhoneDisplay(data.student.phone),
                zipCode: this.formatZipCodeDisplay(data.student.zipCode)
            };
            
            this.mainForm.patchValue({ student: studentWithMask }, { emitEvent: false });
            
            if (data.student.birthDate) this.studentAge = this.service.calculateAge(data.student.birthDate);
            this.isInactive = (data.student as any).isActive === false; 
        }

        // 2. Responsáveis
        const guardiansArray = this.guardiansArray;
        guardiansArray.clear();
        if (data.guardians && data.guardians.length > 0) {
          data.guardians.forEach((g: any) => {
            const group = this.createGuardianGroup(g.isPrincipal);
            
            // APLICA MÁSCARAS NOS RESPONSÁVEIS
            const guardianWithMask = {
                ...g,
                cpf: this.formatCpfDisplay(g.cpf),
                phone: this.formatPhoneDisplay(g.phone),
                messagePhone1: this.formatPhoneDisplay(g.messagePhone1),
                messagePhone2: this.formatPhoneDisplay(g.messagePhone2)
            };

            group.patchValue(guardianWithMask);
            guardiansArray.push(group);
          });
        } else {
           this.addGuardian();
        }

        // 3. Cursos
        if (data.student && data.student.schoolShift) {
          this.service.getAvailableCourses(data.student.schoolShift).subscribe({
            next: (coursesOptions) => {
              this.availableCourses = coursesOptions || [];
              const coursesArray = this.enrollmentsArray;
              coursesArray.clear();
              
              if (data.courses && data.courses.length > 0) {
                data.courses.forEach((c: any) => {
                  const group = this.createCourseGroup();
                  group.patchValue({
                    courseId: c.courseId.toString(),
                    classId: c.classId.toString()
                  });
                  coursesArray.push(group);
                });
              } else {
                this.addCourse();
              }
            },
            error: (err) => { console.error('Erro ao carregar cursos', err); this.addCourse(); }
          });
        } else {
            this.addCourse();
        }

        // 4. Documentos
        const docsArray = this.docsArray;
        docsArray.clear();
        if (data.documents && data.documents.length > 0) {
           data.documents.forEach((d: any) => {
             const group = this.fb.group({
               id: [d.id], 
               fileName: [d.fileName, Validators.required],
               observation: [d.observation],
               file: [null] 
             });
             docsArray.push(group);
           });
        }

        this.isSubmitting = false;
        this.submittingMessage = 'Salvar Matrícula';
      },
      error: (err) => {
        console.error(err);
        alert('Erro ao carregar dados da matrícula.');
        this.router.navigate(['/cadastros/student-list']);
      }
    });
  }

  // --- HELPERS VISUAIS (FORMATADORES) ---
  
  formatCpfDisplay(cpf: string): string {
    if (!cpf) return '';
    const clean = cpf.replace(/\D/g, '');
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  formatPhoneDisplay(phone: string): string {
    if (!phone) return '';
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 11) {
      return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (clean.length === 10) {
      return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  }

  formatZipCodeDisplay(cep: string): string {
    if (!cep) return '';
    const clean = cep.replace(/\D/g, '');
    return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
  }

  reloadCoursesForShift(shift: string) {
    if (this.isSubmitting) return;
    const enrollments = this.enrollmentsArray;
    while (enrollments.length !== 0) { enrollments.removeAt(0); }
    this.addCourse(); 
    this.service.getAvailableCourses(shift).subscribe({
      next: (data) => { this.availableCourses = data || []; },
      error: (err) => { console.error(err); alert('Erro ao carregar cursos.'); }
    });
  }

  cleanNumber(value: string | null | undefined): string {
    if (!value) return '';
    return value.replace(/\D/g, '');
  }

  private getFileExtension(fileName: string): string {
    if (!fileName || !fileName.includes('.')) return 'bin';
    const parts = fileName.split('.');
    const ext = parts.pop();
    return ext ? ext : 'bin';
  }

  cpfAvailabilityValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value || control.value.length < 11) return of(null);
      if (this.isEditMode) return of(null); 

      const cleanValue = this.cleanNumber(control.value);
      return this.service.checkCpfExists(cleanValue).pipe(
        map(exists => (exists ? { cpfTaken: true } : null))
      );
    };
  }

  // --- GETTERS & FORM ARRAY ---
  getGroup(name: string): FormGroup { return this.mainForm.get(name) as FormGroup; }
  get guardiansArray(): FormArray { return this.mainForm.get('guardians') as FormArray; }
  get enrollmentsArray(): FormArray { return this.mainForm.get('enrollments') as FormArray; }
  get docsArray(): FormArray { return this.mainForm.get('docs') as FormArray; }

  createGuardianGroup(isPrincipal: boolean = false): FormGroup {
    return this.fb.group({
      fullName: ['', Validators.required],
      cpf: ['', Validators.required],
      relationship: ['', Validators.required], 
      phone: ['', Validators.required],        
      phoneContact: [''], messagePhone1: [''], messagePhone1Contact: [''], messagePhone2: [''], messagePhone2Contact: [''], 
      isPrincipal: [isPrincipal]
    });
  }

  addGuardian() { this.guardiansArray.push(this.createGuardianGroup()); }
  
  removeGuardian(index: number) {
    if (this.guardiansArray.length <= 1) { alert('É necessário manter pelo menos um responsável.'); return; }
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

  createCourseGroup(): FormGroup { return this.fb.group({ courseId: ['', Validators.required], classId: ['', Validators.required] }); }
  addCourse() { this.enrollmentsArray.push(this.createCourseGroup()); }
  removeCourse(index: number) { this.enrollmentsArray.removeAt(index); }

  addDocument() { 
    this.docsArray.push(this.fb.group({ 
      id: [null],
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

  async onSubmit() {
    if (this.mainForm.invalid) {
      this.mainForm.markAllAsTouched();
      alert('Por favor, verifique os campos obrigatórios.');
      return;
    }

    this.isSubmitting = true;
    this.submittingMessage = 'Salvando...';

    try {
      const rawValue = this.mainForm.getRawValue();
      
      const enrollmentPayload: EnrollmentPayload = {
        student: {
          ...rawValue.student,
          cpf: this.cleanNumber(rawValue.student.cpf),
          phone: this.cleanNumber(rawValue.student.phone),
          zipCode: this.cleanNumber(rawValue.student.zipCode)
        },
        guardians: rawValue.guardians.map((g: any) => ({
          ...g,
          cpf: this.cleanNumber(g.cpf),
          phone: this.cleanNumber(g.phone),
          messagePhone1: this.cleanNumber(g.messagePhone1),
          messagePhone2: this.cleanNumber(g.messagePhone2),
        })),
        documents: rawValue.docs.map((d: any) => ({ 
          fileName: d.fileName, 
          observation: d.observation 
        })), 
        courses: rawValue.enrollments
      };

      let enrollmentId;
      
      if (this.isEditMode && this.enrollmentId) {
         await lastValueFrom(this.service.updateEnrollment(this.enrollmentId, enrollmentPayload));
         enrollmentId = this.enrollmentId;
         
         if (this.isInactive) alert('Matrícula atualizada e REATIVADA com sucesso!');
         else alert('Dados atualizados com sucesso!');
         
      } else {
         const response = await lastValueFrom(this.service.createEnrollment(enrollmentPayload));
         enrollmentId = response.enrollmentId;
         alert(`Matrícula criada com ID: ${enrollmentId}`);
      }

      if (rawValue.docs && rawValue.docs.length > 0 && enrollmentId) {
        this.submittingMessage = `Enviando documentos...`;
        for (const doc of rawValue.docs) {
          if (doc.file) {
            if (doc.file.size === 0) {
                console.warn(`Arquivo vazio: ${doc.fileName}`);
                alert(`O arquivo "${doc.fileName}" está vazio e não será enviado.`);
                continue;
            }
            try {
                const base64 = await this.service.convertFileToBase64(doc.file);
                const ext = this.getFileExtension(doc.fileName);
                
                const filePayload: FileUploadRequest = {
                  entidade_pai: 'matricula', 
                  id_entidade_pai: enrollmentId.toString(), 
                  arquivo_base64: base64, 
                  nome_arquivo: doc.fileName, 
                  extensao: ext, 
                  observacao: doc.observation || ''
                };
                
                await lastValueFrom(this.service.uploadFile(filePayload));
            } catch (uploadErr: any) {
                console.error(`Erro ao enviar arquivo ${doc.fileName}:`, uploadErr);
                const msg = uploadErr.error?.details || uploadErr.error?.error || 'Verifique se o arquivo é válido.';
                alert(`Atenção: O arquivo "${doc.fileName}" falhou no envio. Erro: ${msg}`);
            }
          }
        }
      }

      this.router.navigate(['/cadastros/student-list']);

    } catch (error) {
      console.error('Erro no processo geral:', error);
      alert('Ocorreu um erro. Verifique o console.');
    } finally {
      this.isSubmitting = false;
      this.submittingMessage = 'Salvar Matrícula';
    }
  }
}