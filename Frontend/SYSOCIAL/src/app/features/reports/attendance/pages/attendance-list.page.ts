import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AttendanceService } from '../services/attendance.service';
import { AttendanceGrid, AttendanceRecord, ClassOption, CourseOption, StudentAttendanceRow } from '../interfaces/attendance.model';

@Component({
  selector: 'app-attendance-list-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-screen-2xl mx-auto p-6">
      
      <!-- Header e Filtros -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Chamada Escolar</h1>
            <p class="text-sm text-gray-500">Gerenciamento de presença por turma</p>
          </div>
          <div class="text-right hidden md:block">
            <p class="text-xs font-bold text-gray-400 uppercase">Professor Responsável</p>
            <p class="text-sm font-medium text-gray-800">Steve Johnson</p>
          </div>
        </div>

        <form [formGroup]="filterForm" class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          
          <!-- 1. Curso (Novo Campo) -->
          <div class="md:col-span-4">
            <label class="block text-xs font-bold text-gray-500 uppercase mb-1.5">Curso</label>
            <select formControlName="courseId" (change)="onCourseChange()" class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#246A73] focus:border-transparent transition-all">
              <option [ngValue]="null" disabled>Selecione...</option>
              <option *ngFor="let c of courses" [value]="c.id">{{ c.name }}</option>
            </select>
          </div>

          <!-- 2. Turma (Depende do Curso) -->
          <div class="md:col-span-4">
            <label class="block text-xs font-bold text-gray-500 uppercase mb-1.5">Turma</label>
            <select formControlName="classId" (change)="loadData()" class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#246A73] focus:border-transparent transition-all">
              <option [ngValue]="null" disabled>Selecione...</option>
              <option *ngFor="let c of classes" [value]="c.id">{{ c.name }} - {{ c.schedule }}</option>
            </select>
          </div>

          <!-- 3. Mês/Ano -->
          <div class="md:col-span-4 flex gap-2">
            <div class="flex-1">
               <label class="block text-xs font-bold text-gray-500 uppercase mb-1.5">Mês</label>
               <select formControlName="month" (change)="loadData()" class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white">
                 <option *ngFor="let m of months; let i = index" [value]="i">{{ m }}</option>
               </select>
            </div>
            <div class="w-24">
               <label class="block text-xs font-bold text-gray-500 uppercase mb-1.5">Ano</label>
               <input type="number" formControlName="year" (change)="loadData()" class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white">
            </div>
          </div>
        </form>
      </div>

      <!-- Grid de Chamada -->
      <div *ngIf="gridData" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
        
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold">
                <th class="p-4 sticky left-0 bg-gray-50 z-10 border-r border-gray-200 min-w-[250px]">Nome do Aluno</th>
                
                <!-- Datas Dinâmicas -->
                <th *ngFor="let date of gridData.dates" class="p-2 text-center min-w-[60px] border-r border-gray-100">
                  <div class="flex flex-col">
                    <span class="text-gray-900">{{ date | date:'dd/MM' }}</span>
                    <span class="text-[10px] font-normal text-gray-400">{{ date | date:'EEE' }}</span>
                  </div>
                </th>
                
                <!-- Estatísticas -->
                <th class="p-2 text-center w-20 bg-gray-50 text-green-600 border-l border-gray-200">P</th>
                <th class="p-2 text-center w-20 bg-gray-50 text-red-500">F</th>
                <th class="p-2 text-center w-20 bg-gray-50 text-yellow-600">J</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr *ngFor="let student of gridData.students" class="hover:bg-gray-50 transition-colors group">
                
                <!-- Nome -->
                <td class="p-4 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-200">
                  <span class="font-bold text-gray-700 text-sm">{{ student.studentName }}</span>
                </td>

                <!-- Células de Chamada -->
                <td *ngFor="let date of gridData.dates" class="p-1 text-center border-r border-gray-100">
                  <ng-container *ngIf="getRecord(student, date) as record">
                    
                    <!-- CASE 1: Justificada (Supervisor colocou obs) -->
                    <div *ngIf="isJustified(record)" 
                         class="w-full h-10 rounded bg-yellow-50 border border-yellow-200 flex items-center justify-center cursor-help group/tooltip relative"
                         title="Falta Justificada">
                       <span class="text-sm font-bold text-yellow-600">J</span>
                       <!-- Tooltip simples -->
                       <div class="absolute bottom-full mb-2 hidden group-hover/tooltip:block bg-gray-800 text-white text-xs p-2 rounded whitespace-nowrap z-50 shadow-lg">
                         Obs: {{ record.observation }}
                       </div>
                    </div>

                    <!-- CASE 2: Normal (P ou F) -->
                    <button *ngIf="!isJustified(record)"
                            (click)="togglePresence(student, date)"
                            class="w-full h-10 rounded transition-all flex items-center justify-center font-bold text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                            [ngClass]="record.present ? 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-100' : 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-100'">
                      {{ record.present ? 'P' : 'F' }}
                    </button>

                  </ng-container>
                </td>

                <!-- Stats -->
                <td class="text-center font-bold text-sm text-green-600 border-l border-gray-200">{{ student.stats.presents }}</td>
                <td class="text-center font-bold text-sm text-red-500">{{ student.stats.absences }}</td>
                <td class="text-center font-bold text-sm text-yellow-600">{{ student.stats.justified }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Estado Vazio -->
      <div *ngIf="!gridData && !isLoading" class="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 mt-6">
        <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
        <p class="text-gray-400 font-medium">Selecione um curso e turma para visualizar a chamada.</p>
      </div>

      <!-- Loading -->
      <div *ngIf="isLoading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-[#246A73]"></div>
      </div>

    </div>
  `
})
export class AttendanceListPage implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(AttendanceService);

  filterForm: FormGroup;
  courses: CourseOption[] = [];
  classes: ClassOption[] = [];
  gridData: AttendanceGrid | null = null;
  isLoading = false;

  months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  constructor() {
    this.filterForm = this.fb.group({
      courseId: [null, Validators.required],
      classId: [null, Validators.required],
      month: [new Date().getMonth()],
      year: [new Date().getFullYear()]
    });
  }

  ngOnInit() {
    // 1. Carregar Cursos
    this.service.getCourses().subscribe(data => {
      this.courses = data;
      // 2. Selecionar o primeiro por padrão (Regra de Negócio)
      if (this.courses.length > 0) {
        this.filterForm.patchValue({ courseId: this.courses[0].id });
        this.onCourseChange(); // Carrega as turmas do primeiro curso
      }
    });
  }

  onCourseChange() {
    const courseId = this.filterForm.get('courseId')?.value;
    if (!courseId) return;

    this.gridData = null; // Limpa grid
    this.classes = []; // Limpa turmas antigas
    
    // Carrega turmas deste curso
    this.service.getClasses(courseId).subscribe(data => {
      this.classes = data;
      // Opcional: Selecionar a primeira turma automaticamente se quiser
    });
  }

  loadData() {
    const { classId, month, year } = this.filterForm.value;
    if (!classId) return;

    this.isLoading = true;
    this.service.getAttendanceMatrix(classId, month, year).subscribe({
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

  // --- Helpers para o HTML ---

  getRecord(student: StudentAttendanceRow, date: string): AttendanceRecord | undefined {
    // Retorna o registro ou cria um padrão se não existir (ainda não salvo)
    if (!student.attendance[date]) {
      // Cria um placeholder na memória para o usuário poder clicar
      student.attendance[date] = { present: true, observation: '' };
    }
    return student.attendance[date];
  }

  isJustified(record: AttendanceRecord): boolean {
    // REGRA: Se não está presente E tem observação, é Justificada (J)
    return !record.present && !!record.observation && record.observation.trim() !== '';
  }

  togglePresence(student: StudentAttendanceRow, date: string) {
    const record = student.attendance[date];
    if (this.isJustified(record)) return; // Não altera se for J (só supervisor muda obs)

    // Alterna P <-> F
    record.present = !record.present;

    // Recalcula stats visualmente (opcional, idealmente o backend faria)
    this.updateStats(student);

    // Opcional: Salvar individualmente ou esperar botão salvar
    console.log(`Alterado: ${student.studentName} em ${date} para ${record.present ? 'P' : 'F'}`);
  }

  updateStats(student: StudentAttendanceRow) {
    const records = Object.values(student.attendance);
    student.stats.presents = records.filter(r => r.present).length;
    student.stats.absences = records.filter(r => !r.present && !r.observation).length;
    student.stats.justified = records.filter(r => !r.present && !!r.observation).length;
  }
}