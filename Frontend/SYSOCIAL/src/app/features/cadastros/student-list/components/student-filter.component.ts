import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { StudentFilter } from '../../enrollment/interfaces/enrollment.model';

@Component({
  selector: 'app-student-filter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          Filtros de Pesquisa
        </h2>
        <button type="button" (click)="clearFilters()" class="text-sm text-blue-600 hover:text-blue-800 hover:underline">Limpar filtros</button>
      </div>

      <form [formGroup]="filterForm" (ngSubmit)="onSubmit()" class="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <!-- Nome -->
        <div class="md:col-span-2">
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Aluno</label>
          <input type="text" formControlName="name" placeholder="Digite o nome..." class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>

        <!-- CPF -->
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">CPF</label>
          <input type="text" formControlName="cpf" placeholder="000.000.000-00" mask="000.000.000-00" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>

        <!-- Status -->
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Situação</label>
          <select formControlName="status" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos</option>
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
          </select>
        </div>

        <!-- Botão de Busca -->
        <div class="md:col-span-4 flex justify-end mt-2">
          <button type="submit" class="bg-[#246A73] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-md shadow-gray-500/10">
            Pesquisar
          </button>
        </div>
      </form>
    </div>
  `
})
export class StudentFilterComponent {
  private fb = inject(FormBuilder);
  
  @Output() search = new EventEmitter<StudentFilter>();

  filterForm: FormGroup = this.fb.group({
    name: [''],
    cpf: [''],
    status: ['']
  });

  onSubmit() {
    this.search.emit(this.filterForm.value);
  }

  clearFilters() {
    this.filterForm.reset({ name: '', cpf: '', status: '' });
    this.search.emit(this.filterForm.value);
  }
}