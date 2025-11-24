import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';

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
  guardians: FormArray;
  coursesForm: FormGroup;
  documentsForm: FormGroup;
  
  guardianOpenState: boolean[] = [true];

  // --- DADOS MOCKADOS ---
  // Dados fictícios pra gente simular o banco de dados e testar o front
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
    'Declaração de Matrícula Escolar',
  ];

  relationshipOptions = [
    { value: 'pai', label: 'Pai' },
    { value: 'mae', label: 'Mãe' },
    { value: 'avo', label: 'Avô/Avó' },
    { value: 'tio', label: 'Tio/Tia' },
    { value: 'outro', label: 'Outro' }
  ];

  constructor() {
    // Configuração do formulário do aluno com as validações básicas
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

    // Inicializa a lista de responsáveis já com um item (o principal)
    this.guardians = this.fb.array([
      this.createGuardianGroup()
    ]);

    // Formulário para gerenciar a lista dinâmica de cursos
    this.coursesForm = this.fb.group({
      enrollments: this.fb.array([])
    });

    // Formulário para os documentos anexados
    this.documentsForm = this.fb.group({
      docs: this.fb.array([])
    });

    // Já adiciona uma linha de curso pra não ficar vazio de cara
    this.addCourse();
  }

  // Cria um grupo de dados para um novo responsável
  createGuardianGroup(): FormGroup {
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
      isPrincipal: [false]
    });
  }

  // Helpers marotos pra facilitar o acesso no HTML
  get guardianControls() {
    return this.guardians.controls;
  }

  asFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  // Adiciona um novo responsável na lista e já abre o acordeão dele
  addGuardian() {
    this.guardians.push(this.createGuardianGroup());
    this.guardianOpenState.push(true);
  }

  removeGuardian(index: number) {
    this.guardians.removeAt(index);
    this.guardianOpenState.splice(index, 1);
  }

  // Abre e fecha o acordeão dos responsáveis extras
  toggleGuardian(index: number) {
    this.guardianOpenState[index] = !this.guardianOpenState[index];
  }

  // Garante que só exista UM responsável financeiro marcado
  onPrincipalChange(index: number) {
    const isChecked = this.guardians.at(index).get('isPrincipal')?.value;
    
    if (isChecked) {
      // Se marcou esse cara, desmarca todo o resto da galera
      this.guardians.controls.forEach((control, i) => {
        if (i !== index) {
          control.get('isPrincipal')?.setValue(false, { emitEvent: false });
        }
      });
    }
  }

  // Traduz aquele valor feio tipo 'mae' pra 'Mãe' bonitinho na tela
  getRelationshipLabel(value: string): string {
    const option = this.relationshipOptions.find(o => o.value === value);
    return option ? option.label : '';
  }

  // --- Lógica dos Documentos ---
  get documentControls() {
    return (this.documentsForm.get('docs') as FormArray).controls;
  }

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

  // Pega o arquivo selecionado e guarda no formulário
  onDocumentFileSelected(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const docs = this.documentsForm.get('docs') as FormArray;
      const docGroup = docs.at(index) as FormGroup;
      
      // Atualiza o nome pra mostrar no botão e guarda o arquivo real
      docGroup.patchValue({
        fileName: file.name,
        file: file
      });
    }
  }

  // --- Lógica dos Cursos ---
  get enrollmentControls() {
    return (this.coursesForm.get('enrollments') as FormArray).controls;
  }

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

  // Filtra as turmas pra mostrar só as que pertencem ao curso escolhido
  getClassesForCourse(index: number) {
    const enrollments = this.coursesForm.get('enrollments') as FormArray;
    const courseId = enrollments.at(index).get('courseId')?.value;
    if (!courseId) return [];
    return this.allClasses.filter(c => c.courseId === courseId);
  }

  // --- Getters e Máscaras de formatação ---
  get studentAge(): string {
    const birthDate = this.studentForm.get('birthDate')?.value;
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    // Se ainda não fez aniversário este ano, diminui 1
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age + ' anos';
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

  // Envia tudo pro console (ou backend num mundo real)
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
      // Marca tudo como tocado pra mostrar os erros em vermelho pro usuário se ligar
      this.studentForm.markAllAsTouched();
      this.guardians.markAllAsTouched();
      this.coursesForm.markAllAsTouched();
      this.documentsForm.markAllAsTouched();
      alert('Por favor, preencha todos os campos obrigatórios.');
    }
  }
}