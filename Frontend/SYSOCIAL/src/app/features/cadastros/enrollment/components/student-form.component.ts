import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div [formGroup]="parentForm" class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        
        <div class="flex justify-between items-start mb-8 border-b border-gray-100 pb-4">
          <h2 class="text-xl font-bold text-gray-800">Informações do aluno</h2>
        </div>

        <!-- Dados Pessoais -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
          <div class="md:col-span-6">
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Nome completo</label>
            <input type="text" formControlName="fullName" class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-300" placeholder="Digite o nome completo">
          </div>

          <div class="md:col-span-3">
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Data de nascimento</label>
            <input type="date" formControlName="birthDate" 
                   [class.text-gray-300]="!parentForm.get('birthDate')?.value"
                   [class.text-gray-700]="parentForm.get('birthDate')?.value"
                   class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>

          <div class="md:col-span-3">
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Idade</label>
            <input type="text" [value]="age" readonly [class.text-transparent]="age === null || age < 0 || age > 100" class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none" >
          </div>
        </div>

        <!-- Documentos e Contato -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          
          <!-- CAMPO CPF COM FEEDBACK VISUAL -->
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">CPF</label>
            <input type="text" formControlName="cpf" maxlength="14" (input)="formatCPF($event)" placeholder="000.000.000-00" 
                   [class.border-red-500]="parentForm.get('cpf')?.hasError('cpfTaken') || (parentForm.get('cpf')?.invalid && parentForm.get('cpf')?.touched)"
                   [class.focus:ring-red-500]="parentForm.get('cpf')?.hasError('cpfTaken')"
                   class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300">
            
            <!-- Mensagens de Erro -->
            <p *ngIf="parentForm.get('cpf')?.hasError('cpfTaken')" class="text-red-500 text-xs mt-1 font-bold animate-pulse">
               Este CPF já está cadastrado.
            </p>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Telefone</label>
            <input type="tel" formControlName="phone" maxlength="15" (input)="formatPhone($event)" placeholder="(00) 00000-0000" class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white placeholder:text-gray-300">
          </div>

          <!-- Radio Buttons de Sexo -->
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Sexo</label>
            <div class="flex items-center gap-6 pt-2">
              <label class="flex items-center cursor-pointer relative group">
                <input type="radio" formControlName="gender" value="F" class="peer sr-only">
                <div class="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center transition-all peer-checked:border-gray-800 after:content-[''] after:w-2.5 after:h-2.5 after:rounded-full after:bg-gray-800 after:opacity-0 after:transition-all peer-checked:after:opacity-100 group-hover:border-gray-200"></div>
                <span class="ml-2 text-sm text-gray-600 group-hover:text-gray-400 transition-colors">Feminino</span>
              </label>
              <label class="flex items-center cursor-pointer relative group">
                <input type="radio" formControlName="gender" value="M" class="peer sr-only">
                <div class="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center transition-all peer-checked:border-gray-800 after:content-[''] after:w-2.5 after:h-2.5 after:rounded-full after:bg-gray-800 after:opacity-0 after:transition-all peer-checked:after:opacity-100 group-hover:border-gray-200"></div>
                <span class="ml-2 text-sm text-gray-600 group-hover:text-gray-400 transition-colors">Masculino</span>
              </label>
            </div>
          </div>
        </div>

        <hr class="border-gray-100 my-8">
        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Endereço do Aluno</h3>

        <div class="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
          <div class="md:col-span-2">
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">CEP</label>
            <input type="text" formControlName="zipCode" maxlength="9" (input)="formatZipCode($event)" placeholder="00000-000" class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300">
          </div>
          <div class="md:col-span-5">
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Logradouro</label>
            <input type="text" formControlName="street" class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300">
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Número</label>
            <input type="text" formControlName="number" class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300">
          </div>
          <div class="md:col-span-3">
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Bairro</label>
            <input type="text" formControlName="neighborhood" class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300">
          </div>
        </div>

        <hr class="border-gray-100 my-8">
        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Dados Escolares</h3>

        <div class="grid grid-cols-1 md:grid-cols-7 gap-6 mb-4">
          <div class="md:col-span-3">
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Instituição de ensino atual</label>
            <input type="text" formControlName="currentSchool" class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300">
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Ano letivo atual</label>
            <select formControlName="series" 
                    [class.text-gray-300]="!parentForm.get('series')?.value"
                    [class.text-gray-700]="parentForm.get('series')?.value"
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
               <option value="" disabled selected class="text-gray-300">Selecione...</option>
               <option value="1" class="text-gray-900">1º Ensino Fundamental</option>
               <option value="2" class="text-gray-900">2º Ensino Fundamental</option>
               <option value="3" class="text-gray-900">3º Ensino Fundamental</option>
               <option value="4" class="text-gray-900">4º Ensino Fundamental</option>
               <option value="5" class="text-gray-900">5º Ensino Fundamental</option>
               <option value="6" class="text-gray-900">6º Ensino Fundamental</option>
               <option value="7" class="text-gray-900">7º Ensino Fundamental</option>
               <option value="8" class="text-gray-900">8º Ensino Fundamental</option>
               <option value="9" class="text-gray-900">9º Ensino Fundamental</option>
               <option value="10" class="text-gray-900">1º Ensino Médio</option>
               <option value="11" class="text-gray-900">2º Ensino Médio</option>
               <option value="12" class="text-gray-900">3º Ensino Médio</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Turno escolar</label>
            <select formControlName="schoolShift" 
                    [class.text-gray-300]="!parentForm.get('schoolShift')?.value"
                    [class.text-gray-700]="parentForm.get('schoolShift')?.value"
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
               <option value="" disabled selected class="text-gray-300">Selecione...</option>
               <option value="manha" class="text-gray-900">Matutino</option>
               <option value="tarde" class="text-gray-900">Vespertino</option>
               <option value="integral" class="text-gray-900">Integral</option>
            </select>
          </div>
        </div>

        <hr class="border-gray-100 my-8">
        <div class="grid grid-cols-1 gap-6 mb-4">
           <div>
             <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Observações Gerais</label>
             <textarea formControlName="observation" rows="3" class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300" placeholder="Informe alergias, condições médicas ou outras informações importantes..."></textarea>
           </div>
        </div>

      </div>
  `
})
export class StudentFormComponent {
  @Input({required: true}) parentForm!: FormGroup;
  @Input() age: number = -1;

  formatCPF(event: any): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); 
    if (value.length > 11) value = value.substring(0, 11);
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    input.value = value;
    this.parentForm.get('cpf')?.setValue(value, { emitEvent: true });
  }

  formatPhone(event: any): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11);
    if (value.length > 2) value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
    if (value.length > 7) value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    input.value = value;
  }

  formatZipCode(event: any): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 8) value = value.substring(0, 8);
    if (value.length > 5) value = value.replace(/(\d{5})(\d)/, '$1-$2');
    input.value = value;
  }
}