import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-enrollment',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule, 
    ReactiveFormsModule,
  ],
  templateUrl: './enrollment.component.html',
  styleUrls: ['./enrollment.component.css']
})
export class EnrollmentComponent {
  private fb = inject(FormBuilder);

  studentForm: FormGroup;
  guardians: FormArray;
  coursesForm: FormGroup;
  documentsForm: FormGroup;
  
  guardianOpenState: boolean[] = [true];

  // --- DADOS MOCKADOS ---
  availableCourses = [
    { id: '1', name: 'Ensino Fundamental I' },
    { id: '2', name: 'Ensino Fundamental II' },
    { id: '3', name: 'Ensino Médio' },
    { id: '4', name: 'Curso Extra: Robótica' },
    { id: '5', name: 'Curso Extra: Ballet' },
    { id: '6', name: 'Curso Extra: Futsal' }
  ];

  allClasses = [
    { id: '101', courseId: '1', name: '1º Ano A - Manhã' },
    { id: '102', courseId: '1', name: '1º Ano B - Tarde' },
    { id: '103', courseId: '1', name: '2º Ano A - Manhã' },
    { id: '401', courseId: '4', name: 'Turma Iniciante - Ter/Qui 14h' },
    { id: '402', courseId: '4', name: 'Turma Avançada - Sex 14h' },
    { id: '501', courseId: '5', name: 'Baby Class - Seg/Qua 09h' },
    { id: '502', courseId: '5', name: 'Preparatório - Seg/Qua 10h' }
  ];

  documentTypes = [
    'RG do Aluno',
    'CPF do Aluno',
    'Certidão de Nascimento',
    'RG do Responsável',
    'CPF do Responsável',
    'Comprovante de Residência',
    'Histórico Escolar',
    'Carteira de Vacinação',
    'Declaração de Transferência'
  ];

  relationshipOptions = [
    { value: 'pai', label: 'Pai' },
    { value: 'mae', label: 'Mãe' },
    { value: 'avo', label: 'Avô/Avó' },
    { value: 'tio', label: 'Tio/Tia' },
    { value: 'outro', label: 'Outro' }
  ];

  constructor() {
    // 1. Student Form
    this.studentForm = this.fb.group({
      fullName: ['', Validators.required],
      birthDate: ['', Validators.required],
      cpf: ['', Validators.required],
      zipCode: ['', Validators.required],
      street: ['', Validators.required],
      number: ['', Validators.required],
      neighborhood: ['', Validators.required],
      state: [''],
      currentSchool: [''],
      series: [''],
      schoolShift: [''],
      phone: [''],
      gender: ['']
    });

    // 2. Guardian Form Array
    this.guardians = this.fb.array([
      this.createGuardianGroup(true) 
    ]);

    // 3. Courses Form
    this.coursesForm = this.fb.group({
      enrollments: this.fb.array([])
    });

    // 4. Documents Form
    this.documentsForm = this.fb.group({
      docs: this.fb.array([])
    });

    this.addCourse();
  }

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

  get guardianControls() { return this.guardians.controls; }
  asFormGroup(control: AbstractControl): FormGroup { return control as FormGroup; }
  
  addGuardian() {
    this.guardians.push(this.createGuardianGroup(false));
    this.guardianOpenState.push(true);
  }

  removeGuardian(index: number) {
    if (this.guardians.length <= 1) {
      alert('É necessário manter pelo menos um responsável.');
      return;
    }
    this.guardians.removeAt(index);
    this.guardianOpenState.splice(index, 1);
    
    const hasPrincipal = this.guardians.controls.some(g => g.get('isPrincipal')?.value);
    if (!hasPrincipal && this.guardians.length > 0) {
        this.guardians.at(0).get('isPrincipal')?.setValue(true);
    }
  }

  toggleGuardian(index: number) {
    this.guardianOpenState[index] = !this.guardianOpenState[index];
  }

  onPrincipalChange(index: number) {
    const currentGuardian = this.guardians.at(index);
    const isChecked = currentGuardian.get('isPrincipal')?.value;

    // Se tentar desmarcar
    if (!isChecked) {
      // Verifica se existe outro principal
      const hasAnotherPrincipal = this.guardians.controls.some((g, i) => i !== index && g.get('isPrincipal')?.value);
      
      // Se não houver outro principal, impede a desmarcação
      if (!hasAnotherPrincipal) {
        // Reverte para true
        currentGuardian.get('isPrincipal')?.setValue(true, { emitEvent: false });
        alert('É obrigatório ter um responsável financeiro/principal selecionado.');
        return;
      }
    }

    // Se marcou este, desmarca os outros
    if (isChecked) {
      this.guardians.controls.forEach((control, i) => {
        if (i !== index) {
          control.get('isPrincipal')?.setValue(false, { emitEvent: false });
        }
      });
    }
  }

  getRelationshipLabel(value: string): string {
    const option = this.relationshipOptions.find(o => o.value === value);
    return option ? option.label : '';
  }

  // --- DOCUMENT ACTIONS ---
  get documentControls() { return (this.documentsForm.get('docs') as FormArray).controls; }
  
  addDocument() {
    const docs = this.documentsForm.get('docs') as FormArray;
    docs.push(this.fb.group({
      type: ['', Validators.required],
      fileName: ['', Validators.required],
      file: [null]
    }));
  }

  removeDocument(index: number) {
    const docs = this.documentsForm.get('docs') as FormArray;
    docs.removeAt(index);
  }

  onDocumentFileSelected(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const docs = this.documentsForm.get('docs') as FormArray;
      const docGroup = docs.at(index) as FormGroup;
      
      docGroup.patchValue({ fileName: file.name, file: file });
    }
  }

  // --- COURSE ACTIONS ---
  get enrollmentControls() { return (this.coursesForm.get('enrollments') as FormArray).controls; }

  addCourse() {
    const enrollments = this.coursesForm.get('enrollments') as FormArray;
    enrollments.push(this.fb.group({
      courseId: ['', Validators.required],
      classId: ['', Validators.required]
    }));
  }

  removeCourse(index: number) {
    const enrollments = this.coursesForm.get('enrollments') as FormArray;
    enrollments.removeAt(index);
  }

  getClassesForCourse(index: number) {
    const enrollments = this.coursesForm.get('enrollments') as FormArray;
    const courseId = enrollments.at(index).get('courseId')?.value;
    if (!courseId) return [];
    return this.allClasses.filter(c => c.courseId === courseId);
  }

  // --- GETTERS & MASKS ---
  get studentAge(): number {
    const birthDate = this.studentForm.get('birthDate')?.value;
    if (!birthDate) return -1;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  formatZipCode(event: any): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 8) value = value.substring(0, 8);
    if (value.length > 5) value = value.replace(/(\d{5})(\d)/, '$1-$2');
    input.value = value;
  }

  formatCPF(event: any): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); 
    if (value.length > 11) value = value.substring(0, 11);
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    input.value = value;
  }

  formatPhone(event: any): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11);
    if (value.length > 2) value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
    if (value.length > 7) value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    input.value = value;
  }

  onSubmit(): void {
    if (this.studentForm.valid && this.guardians.valid && this.coursesForm.valid && this.documentsForm.valid) {
      const fullData = {
        student: { ...this.studentForm.getRawValue(), calculatedAge: this.studentAge },
        guardians: this.guardians.getRawValue(),
        courses: this.coursesForm.getRawValue().enrollments,
        documents: this.documentsForm.getRawValue().docs.map((d: any) => ({ type: d.type, fileName: d.fileName }))
      };
      console.log('Dados completos para envio:', fullData);
      alert('Matrícula criada com sucesso!');
    } else {
      this.studentForm.markAllAsTouched();
      this.guardians.markAllAsTouched();
      this.coursesForm.markAllAsTouched();
      this.documentsForm.markAllAsTouched();
      alert('Por favor, preencha todos os campos obrigatórios.');
    }
  }
}