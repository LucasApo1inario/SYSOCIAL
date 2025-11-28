import { Component, EventEmitter, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { StudentFilter } from '../../enrollment/interfaces/enrollment.model';

@Component({
  selector: 'app-student-filter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div class="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
        <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          Filtros Avançados
        </h2>
        <button type="button" (click)="clearFilters()" class="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-wide">Limpar filtros</button>
      </div>

      <form [formGroup]="filterForm" (ngSubmit)="onSubmit()" class="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        <!-- LINHA 1: Dados Pessoais -->
        <div class="md:col-span-4">
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Aluno</label>
          <input type="text" formControlName="name" placeholder="Digite o nome..." class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>

        <div class="md:col-span-3">
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">CPF</label>
          <input type="text" formControlName="cpf" placeholder="000.000.000-00" mask="000.000.000-00" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>

        <div class="md:col-span-2">
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Idade</label>
          <input type="number" formControlName="age" placeholder="Ex: 10" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>

        <div class="md:col-span-3">
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Sexo</label>
          <select formControlName="gender" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </select>
        </div>

        <!-- LINHA 2: Dados Escolares -->
        <div class="md:col-span-5">
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Escola (Nome)</label>
          <input type="text" formControlName="school" placeholder="Ex: Escola Municipal..." class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>

        <div class="md:col-span-3">
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Turno Escolar</label>
          <select formControlName="schoolShift" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos</option>
            <option value="manha">Manhã</option>
            <option value="tarde">Tarde</option>
            <option value="integral">Integral</option>
          </select>
        </div>

        <div class="md:col-span-4">
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Situação da Matrícula</label>
          <select formControlName="status" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ATIVO">Apenas Ativos (Padrão)</option>
            <option value="INATIVO">Apenas Inativos</option>
            <option value="">Todos</option>
          </select>
        </div>

        <!-- LINHA 3: Dados do Curso -->
        <div class="md:col-span-4">
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Curso</label>
          <input type="text" formControlName="course" placeholder="Ex: Robótica, Futsal..." class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>

        <div class="md:col-span-4">
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Turma</label>
          <input type="text" formControlName="class" placeholder="Ex: Turma A..." class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>

        <div class="md:col-span-4">
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Turno do Curso</label>
          <select formControlName="courseShift" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos</option>
            <option value="Manhã">Manhã</option>
            <option value="Tarde">Tarde</option>
            <option value="Noite">Noite</option>
            <option value="Integral">Integral</option>
          </select>
        </div>

        <!-- Botão de Busca -->
        <div class="md:col-span-12 flex justify-end mt-4 pt-4 border-t border-gray-100">
          <button type="submit" class="bg-[#246A73] text-white px-8 py-2.5 rounded-lg text-sm font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-teal-900/20 transform hover:-translate-y-0.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            Aplicar Filtros
          </button>
        </div>
      </form>
    </div>
  `
})
export class StudentFilterComponent implements OnInit {
  private fb = inject(FormBuilder);
  
  @Output() search = new EventEmitter<StudentFilter>();

  filterForm: FormGroup = this.fb.group({
    name: [''],
    cpf: [''],
    age: [''],
    gender: [''],
    school: [''],
    schoolShift: [''],
    status: ['ATIVO'],
    course: [''],
    class: [''],
    courseShift: ['']
  });

  ngOnInit() {
    // this.search.emit(this.filterForm.value);
  }

  onSubmit() {
    this.search.emit(this.filterForm.value);
  }

  clearFilters() {
    this.filterForm.reset({ 
      name: '', cpf: '', age: '', gender: '', 
      school: '', schoolShift: '', 
      status: 'ATIVO', 
      course: '', class: '', courseShift: '' 
    });
    this.search.emit(this.filterForm.value);
  }
}