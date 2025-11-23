import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

@Component({
  selector: 'app-enrollment',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
  ],
  templateUrl: './enrollment.component.html',
  styleUrls: ['./enrollment.component.css']
})
export class EnrollmentComponent {
  private fb = inject(FormBuilder);

  studentForm: FormGroup;
  guardianForm: FormGroup;
  coursesForm: FormGroup; // Novo formulário para cursos

  // --- DADOS MOCKADOS (Simulando banco de dados) ---
  availableCourses = [
    { id: '1', name: 'Ensino Fundamental I' },
    { id: '2', name: 'Ensino Fundamental II' },
    { id: '3', name: 'Ensino Médio' },
    { id: '4', name: 'Curso Extra: Robótica' },
    { id: '5', name: 'Curso Extra: Ballet' },
    { id: '6', name: 'Curso Extra: Futsal' }
  ];

  allClasses = [
    // Fundamental I
    { id: '101', courseId: '1', name: '1º Ano A - Manhã' },
    { id: '102', courseId: '1', name: '1º Ano B - Tarde' },
    { id: '103', courseId: '1', name: '2º Ano A - Manhã' },
    // Robótica
    { id: '401', courseId: '4', name: 'Turma Iniciante - Ter/Qui 14h' },
    { id: '402', courseId: '4', name: 'Turma Avançada - Sex 14h' },
    // Ballet
    { id: '501', courseId: '5', name: 'Baby Class - Seg/Qua 09h' },
    { id: '502', courseId: '5', name: 'Preparatório - Seg/Qua 10h' }
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

    // 2. Guardian Form
    this.guardianForm = this.fb.group({
      fullName: ['', Validators.required],
      cpf: ['', Validators.required],
      relationship: ['', Validators.required], 
      phone: ['', Validators.required],        
      phoneContact: [''], 
      messagePhone1: [''],                     
      messagePhone1Contact: [''], 
      messagePhone2: [''],                     
      messagePhone2Contact: [''], 
      isPrincipal: [false]
    });

    // 3. Courses Form (Novo)
    this.coursesForm = this.fb.group({
      enrollments: this.fb.array([]) // Começa vazio ou com um item
    });

    // Adiciona um curso inicial por padrão
    this.addCourse();
  }

  // --- GETTERS ---
  get studentAge(): string {
    const birthDate = this.studentForm.get('birthDate')?.value;
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age + ' anos';
  }

  get enrollmentControls() {
    return (this.coursesForm.get('enrollments') as FormArray).controls;
  }

  // --- AÇÕES DE CURSO ---
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

  // Filtra as turmas com base no curso selecionado naquela linha específica
  getClassesForCourse(index: number) {
    const enrollments = this.coursesForm.get('enrollments') as FormArray;
    const courseId = enrollments.at(index).get('courseId')?.value;
    
    if (!courseId) return [];
    
    return this.allClasses.filter(c => c.courseId === courseId);
  }

  // --- MÁSCARAS ---
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
    if (this.studentForm.valid && this.guardianForm.valid && this.coursesForm.valid) {
      const fullData = {
        student: { ...this.studentForm.getRawValue(), calculatedAge: this.studentAge },
        guardian: this.guardianForm.getRawValue(),
        courses: this.coursesForm.getRawValue().enrollments
      };
      
      console.log('Dados completos para envio:', fullData);
      alert('Matrícula criada com sucesso!');
    } else {
      this.studentForm.markAllAsTouched();
      this.guardianForm.markAllAsTouched();
      this.coursesForm.markAllAsTouched();
      alert('Por favor, preencha todos os campos obrigatórios.');
    }
  }
}