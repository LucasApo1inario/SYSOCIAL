import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormGroup } from '@angular/forms';
import { EnrollmentService } from '../services/enrollment.service';

@Component({
  selector: 'app-documents-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div [formGroup]="parentForm" class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
      <div class="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
        <h2 class="text-xl font-bold text-gray-800">Documentos</h2>
        <button type="button" (click)="add.emit()" class="flex items-center gap-2 px-3.5 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-xs font-semibold transition-colors border border-gray-200 shadow-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          Adicionar Documento
        </button>
      </div>

      <div formArrayName="docs">
        <div *ngFor="let doc of docs.controls; let i = index" [formGroupName]="i" class="mb-4 p-5 bg-gray-50 rounded-lg border border-gray-200 flex flex-col md:flex-row items-start md:items-end gap-4 relative group hover:border-gray-300 transition-colors">
          
          <div class="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 w-full">
             
             <div class="md:col-span-6">
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Arquivo</label>
              <div class="flex items-center gap-2">
                <input type="file" #fileInput class="hidden" (change)="onFileSelected($event, i)">
                
                <button type="button" (click)="fileInput.click()" class="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-white hover:border-blue-400 transition-all flex items-center gap-2 truncate">
                   <svg class="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                   <span class="truncate">{{ doc.get('fileName')?.value || 'Escolher arquivo...' }}</span>
                </button>

                <!-- BOTÃO VISUALIZAR (Só aparece se tiver ID salvo no banco) -->
                <button *ngIf="doc.get('id')?.value" 
                        (click)="viewDocument(doc.get('id')?.value, doc.get('fileName')?.value)"
                        type="button" 
                        class="p-2.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors shadow-sm" 
                        title="Visualizar Documento">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                </button>
              </div>
            </div>

            <div class="md:col-span-6">
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Observação</label>
              <input type="text" formControlName="observation" class="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          </div>

          <button type="button" (click)="remove.emit(i)" class="text-gray-400 hover:text-red-500 p-2.5 rounded-full hover:bg-white transition-all shadow-sm border border-transparent hover:border-gray-100 mb-[1px]">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      </div>
      <p *ngIf="docs.length === 0" class="text-sm text-gray-500 text-center italic py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">Nenhum documento anexado.</p>
    </div>
  `
})
export class DocumentsFormComponent {
  private service = inject(EnrollmentService);

  @Input({required: true}) parentForm!: FormGroup;
  @Input() documentTypes: string[] = [];

  @Output() add = new EventEmitter<void>();
  @Output() remove = new EventEmitter<number>();
  @Output() fileSelected = new EventEmitter<{event: Event, index: number}>();

  get docs(): FormArray {
    return this.parentForm.get('docs') as FormArray;
  }

  onFileSelected(event: Event, index: number) {
    this.fileSelected.emit({event, index});
  }

  viewDocument(id: number, fileName: string) {
    this.service.getFile(id).subscribe({
      next: (response) => {
        // O backend Go retorna { success: true, data: { arquivo_base64: "..." } }
        if (response.success && response.data && response.data.arquivo_base64) {
           this.service.openFile(response.data.arquivo_base64, fileName);
        } else {
           alert('Arquivo não encontrado ou retorno inválido.');
        }
      },
      error: (err) => {
        console.error(err);
        alert('Erro ao baixar o documento. Verifique se o File Service está rodando.');
      }
    });
  }
}