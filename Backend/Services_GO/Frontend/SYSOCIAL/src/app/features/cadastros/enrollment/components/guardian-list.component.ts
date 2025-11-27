import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormGroup, AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-guardian-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- IMPORTANTE: Removemos formArrayName aqui para evitar conflito com [formGroup] nos filhos -->
    <div *ngFor="let guardian of guardians.controls; let i = index">
      
      <!-- Card do Responsável Principal -->
      <div *ngIf="i === 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8" [formGroup]="asFormGroup(guardian)">
          <div class="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
            <div class="flex items-center gap-3">
              <h2 class="text-xl font-bold text-gray-800">Dados do Responsável</h2>
            </div>
            <button *ngIf="guardians.length > 1" type="button" (click)="remove.emit(i)" class="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors" title="Remover">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
          
          <!-- Reutiliza o template do formulário -->
          <ng-container *ngTemplateOutlet="guardianFormTemplate; context: { form: asFormGroup(guardian), i: i }"></ng-container>
      </div>

      <!-- Acordeão para Responsáveis Adicionais -->
      <div *ngIf="i > 0" class="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 overflow-hidden" [formGroup]="asFormGroup(guardian)">
          <div class="flex justify-between items-center p-5 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors" (click)="toggleGuardian(i)">
              <div class="flex items-center gap-4">
                  <div class="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs shadow-sm">
                      {{ i + 1 }}
                  </div>
                  <div>
                      <h3 class="text-sm font-bold text-gray-800">
                          {{ asFormGroup(guardian).get('fullName')?.value || 'Novo Responsável' }}
                      </h3>
                      <p class="text-xs text-gray-500 font-medium">{{ getRelationshipLabel(asFormGroup(guardian).get('relationship')?.value) || 'Parentesco não informado' }}</p>
                  </div>
              </div>
              <div class="flex items-center gap-3">
                  <button *ngIf="guardians.length > 1" type="button" (click)="remove.emit(i); $event.stopPropagation()" class="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                  <svg class="w-5 h-5 text-gray-400 transform transition-transform duration-200" [class.rotate-180]="guardianOpenState[i]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
              </div>
          </div>
          <div class="p-8 border-t border-gray-100" [class.hidden]="!guardianOpenState[i]">
              <ng-container *ngTemplateOutlet="guardianFormTemplate; context: { form: asFormGroup(guardian), i: i }"></ng-container>
          </div>
      </div>
    </div>

    <div class="flex justify-center mb-10">
      <button type="button" (click)="onAdd()" class="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-full text-sm font-semibold transition-all shadow-sm hover:shadow border border-gray-200">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          Adicionar outro responsável
      </button>
    </div>

    <!-- TEMPLATE REUTILIZÁVEL (Formulário do Responsável) -->
    <ng-template #guardianFormTemplate let-form="form" let-i="i">
      <!-- Aqui [formGroup]="form" usa o FormGroup passado pelo contexto, isolando o escopo -->
      <div [formGroup]="form" class="grid grid-cols-1 gap-6">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div class="md:col-span-8">
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Nome Completo</label>
              <input type="text" formControlName="fullName" class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300">
            </div>
            <div class="md:col-span-4">
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Parentesco</label>
              <select formControlName="relationship" 
                      [class.text-gray-300]="!form.get('relationship')?.value"
                      [class.text-gray-700]="form.get('relationship')?.value"
                      class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="" disabled selected class="text-gray-300">Selecione...</option>
                <option *ngFor="let rel of relationshipOptions" [value]="rel.value" class="text-gray-900">{{ rel.label }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div class="md:col-span-3">
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">CPF</label>
              <input type="text" formControlName="cpf" maxlength="14" (input)="formatCPF($event)" placeholder="000.000.000-00" class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300">
            </div>
            <div class="md:col-span-3">
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Telefone Principal</label>
              <input type="tel" formControlName="phone" maxlength="15" (input)="formatPhone($event)" placeholder="(00) 00000-0000" class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300">
            </div>
            <div class="md:col-span-3">
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Contato (Nome)</label>
              <input type="text" formControlName="phoneContact" placeholder="Ex: Próprio, Trabalho..." class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300">
            </div>
            <div class="md:col-span-3 flex items-end pb-4">
              <label class="flex items-center p-3 border border-blue-100 bg-blue-50 rounded-lg w-full cursor-pointer hover:bg-blue-100 transition-colors">
                <input type="checkbox" formControlName="isPrincipal" (change)="principalChange.emit(i)" class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                <div class="ml-3">
                  <span class="text-sm font-semibold text-blue-900">Responsável principal</span>
                  <p class="text-xs text-blue-600">Assinará a matrícula</p>
                </div>
              </label>
            </div>
          </div>

          <div class="mt-4 pt-6 border-t border-gray-100">
            <h3 class="text-sm font-bold text-gray-600 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info-icon lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              Contatos de Emergência / Recados (Opcional)
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="bg-gray-50 p-5 rounded-lg border border-gray-200">
                <div class="mb-3">
                  <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Telefone</label>
                  <input type="tel" formControlName="messagePhone1" maxlength="15" (input)="formatPhone($event)" placeholder="(00) 00000-0000" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white placeholder:text-gray-300">
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Falar com (Nome)</label>
                  <input type="text" formControlName="messagePhone1Contact" placeholder="Nome do contato" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white placeholder:text-gray-300">
                </div>
              </div>
              <div class="bg-gray-50 p-5 rounded-lg border border-gray-200">
                <div class="mb-3">
                  <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Telefone</label>
                  <input type="tel" formControlName="messagePhone2" maxlength="15" (input)="formatPhone($event)" placeholder="(00) 00000-0000" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white placeholder:text-gray-300">
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Falar com (Nome)</label>
                  <input type="text" formControlName="messagePhone2Contact" placeholder="Nome do contato" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white placeholder:text-gray-300">
                </div>
              </div>
            </div>
          </div>
      </div>
    </ng-template>
  `
})
export class GuardianListComponent {
  @Input({required: true}) parentForm!: FormGroup;
  @Input() relationshipOptions: any[] = [];
  
  @Output() add = new EventEmitter<void>();
  @Output() remove = new EventEmitter<number>();
  @Output() principalChange = new EventEmitter<number>();

  guardianOpenState: boolean[] = [true];

  get guardians(): FormArray {
    return this.parentForm.get('guardians') as FormArray;
  }

  asFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  toggleGuardian(index: number) {
    while (this.guardianOpenState.length <= index) {
      this.guardianOpenState.push(false);
    }
    this.guardianOpenState[index] = !this.guardianOpenState[index];
  }

  onAdd() {
    this.add.emit();
    this.guardianOpenState.push(true);
  }

  getRelationshipLabel(value: string): string {
    const option = this.relationshipOptions.find(o => o.value === value);
    return option ? option.label : '';
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
}